const { z } = require('zod')

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const createUserSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters').max(50),
    password: passwordSchema,
    roleName: z.enum(['super_admin', 'teacher', 'student', 'guardian', 'accountant', 'hr_manager'], {
      errorMap: () => ({ message: 'Invalid role specified' }),
    }),
  }),
})

const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: passwordSchema,
  }),
})

module.exports = {
  createUserSchema,
  resetPasswordSchema,
  passwordSchema,
}
