import ResetPasswordClient from "./reset-password-client"

export default async function ResetPasswordPage(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  return <ResetPasswordClient token={token} />
}