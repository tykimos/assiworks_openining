import { z } from "zod"

export const registrationSchema = z.object({
  name: z.string().min(2, "이름을 입력해주세요."),
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  headcount: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(1).max(20).optional(),
  ),
  note: z.string().max(500).optional(),
})

export type RegistrationInput = z.infer<typeof registrationSchema>
