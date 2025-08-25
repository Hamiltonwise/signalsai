import { apiGet } from ".";

export async function getHello() {
  try {
    return await apiGet({ path: "/hello" });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}
