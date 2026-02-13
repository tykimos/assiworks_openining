Send‑Mail API Specification (v1)
1. 개요
Azure Container Apps에 배포된 Send‑Mail 서비스는 
1.	사용자 발송의 경우 개별 SMTP 공급자(Gmail·Naver·Kakao)를 통해 100개 이하 메일을 전송하는 REST API를 제공합니다. 
2.	회사 발송의 경우 aws ses를 통해 프로덕션 계정의 경우 대량 메일링 서비스를 지원합니다.
3.	본 문서는 엔드포인트, 요청/응답 포맷, 오류 처리를 정리합니다.
2. 기본 URL
https://send-mail.nicedune-dfc430a8.westus2.azurecontainerapps.io
3. 인증
현재 버전은 별도의 인증이 없으며, 네트워크 ACL(사내 VNet/IP 화이트리스트 등)을 통해 보호할 수 있습니다. 향후 JWT 또는 API Key 기반 인증을 추가할 수 있습니다.
4. 오류 처리
모든 오류는 HTTP status code와 함께 JSON 바디로 반환됩니다.
{
  "timestamp": "2025-07-02T15:04:33Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed: senderEmail must be a valid email address",
  "path": "/api/v1/emails/aws-send"
}

Status	의미
400	잘못된 요청 파라미터/형식
401	(향후) 인증 실패
403	권한 부족
429	내부 배치 큐가 포화된 경우 또는 AWS SES SendQuota 초과
500	알 수 없는 서버 오류
 
5. 엔드포인트
5.1 POST /emails/aws-send
aws ses 샌드박스 계정의 경우 발신자 수신자 모두 인증된 이메일로만 송수신이 가능하며 프로덕션 계정의 경우 발신자만 인증된다면 수신자 인증은 필요없게 됩니다.AWS SES를 이용한 대량 메일 발송. 내부적으로 500 건 단위로 배치 분할하여 비동기 전송합니다.
Request Headers
Content-Type: application/json
Request Body
필드	타입	필수	설명
senderEmail	string	✓	SES에 검증된 발신자 주소 or 도메인
recipientEmails	array	✓	수신자 주소 목록
subject	string	✓	제목
body	string	✓	본문(plain text)
Response 200
{
  "messageIds": [
    "010c0197c4bb3a2b-8a26729f-5a3a-4c12-9904-a0c181da7ab1-000000",
    "..."
  ]
}
 
5.2 POST/emails/user-send
SMTP 제공업체(GMAIL·NAVER·KAKAO)를 통한 일반 메일 발송. 메일 서버 연결 정보는 서비스에서 자동 설정하며, 앱 비밀번호 또는 SMTP 패스워드를 제공해야 합니다.
Request Body
필드	타입	필수	설명
provider	string	✓	GMAIL | NAVER | KAKAO
senderEmail	string	✓	로그인 계정(발신자)
password	string	✓	앱 비밀번호/SMTP 패스워드
recipientEmails	array	✓	수신자 목록
subject	string	✓	제목
body	string	✓	본문(plain text)
Response 200 동일 형식(messageIds 배열) 반환, SMTP 서버에서 제공하는 Message-ID 헤더 값 사용.
 
6. 데이터 모델
6.1 AwsEmailRequest
{
  "senderEmail": "no-reply@example.com",
  "recipientEmails": ["user1@example.com", "user2@example.com"],
  "subject": "Welcome!",
  "body": "Thank you for signing up."
}
6.2 UserEmailRequest
{
  "provider": "GMAIL",
  "senderEmail": "your@gmail.com",
  "password": "appPassword",
  "recipientEmails": ["friend@example.com”, 

  "subject": "Hi",
  "body": "Long time no see!"
}
 
7. AWS SES 샌드박스 → 프로덕션 전환 체크리스트
✅ 1) SES 샌드박스 상태 확인
●	현재 AWS SES가 샌드박스인지, 프로덕션인지 확인합니다.
→ AWS 콘솔 > SES 대시보드 > Sending Statistics 또는 Sending Limits에서 상태를 확인 가능.
✅ 2) 이메일/도메인 검증 완료
●	발송자 메일 주소 또는 도메인을 SES에 인증(Verify)해야 합니다.
●	도메인을 인증하면 동일 도메인의 모든 메일주소를 사용할 수 있어 편리.
✅ 3) SPF, DKIM 설정
○	도메인에 SPF 레코드 추가: SES 권장 SPF 값
v=spf1 include:amazonses.com ~all
●	
●	DKIM 레코드 추가: SES 콘솔에서 생성된 3개의 CNAME 레코드를 도메인 DNS에 등록.
●	설정 후 SES에서 “검증됨(verified)” 상태인지 확인.
✅ 4) DMARC 권장
●	필수는 아니지만, 도메인 평판 관리를 위해 DMARC 레코드를 설정 권장.
○	예시:
v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com
●	
✅ 5) 프로덕션 요청 제출
●	AWS Support 콘솔 > SES 서비스 제한 증가 요청 에서
○	Case type: Service limit increase
○	Limit type: SES Sending Limits
○	Region: SES 사용 리전 선택
○	Mail Type, Website URL, Use case details 작성
○	“I need production access” 체크
✅ 6) 발송 유형과 케이스 상세 작성
●	어떤 유형의 이메일(트랜잭션, 마케팅 등)을 발송할지 상세히 작성.
●	수신자가 동의한 리스트에만 발송할 계획임을 강조.
●	사용 사례를 구체적으로 작성하면 승인 확률이 높음.
✅ 7) 발송량 요구사항 기재
●	일일 발송량, 초당 발송량 등 예상 요구량을 기재.
●	초기에는 낮게 승인될 수 있으며 필요시 증액 요청 가능.
✅ 8) 반송(Bounce), 수신거부(Complaint) 처리 계획
●	SES는 반송/불만율이 일정 수준을 초과하면 발송 제한이 걸림.
●	SNS로 bounce/complaint 알림 처리 로직 설계 권장.
✅ 9) AWS 정책 준수
●	AWS Acceptable Use Policy에 위반되는 컨텐츠(스팸, 불법 콘텐츠 등) 발송은 금지.
●	AWS AUP 내용 숙지.
✅ 10) Sandbox 전환 완료 후 테스트
●	Production 승인이 나면,
○	발송자 제한 해제 (임의의 수신자에게 발송 가능).
○	실제 프로덕션 발송 시 소규모로 테스트 후 대량 발송 진행.
○	
 
참고 자료
스웨거 주소 : https://send-mail.nicedune-dfc430a8.westus2.azurecontainerapps.io/swagger-ui/index.html
샌드박스 -> 프로덕션 예시 : https://kth990303.tistory.com/449

https://send-mail.nicedune-dfc430a8.westus2.azurecontainerapps.io/swagger-ui/index.html#

aws 대량 메일 전송입니다 테스트 완료했습니다
발신자는 se@aifactory.page 고정입니다 -> aws ses 이용중