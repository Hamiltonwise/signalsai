import { apiPost } from "./index";

const baseurl = "/auth";

async function register(email: string, password: string, confirmPassword: string) {
  return apiPost({
    path: `${baseurl}/register`,
    passedData: { email, password, confirmPassword },
  });
}

async function verifyEmail(email: string, code: string) {
  return apiPost({
    path: `${baseurl}/verify-email`,
    passedData: { email, code },
  });
}

async function login(email: string, password: string) {
  return apiPost({
    path: `${baseurl}/login`,
    passedData: { email, password },
  });
}

async function resendVerification(email: string) {
  return apiPost({
    path: `${baseurl}/resend-verification`,
    passedData: { email },
  });
}

const authPassword = {
  register,
  verifyEmail,
  login,
  resendVerification,
};

export default authPassword;
