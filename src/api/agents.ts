import { apiGet } from "./index";

const baseurl = "/agents";

async function getLatestAgentData(googleAccountId: number) {
  try {
    return await apiGet({
      path: baseurl + `/latest/${googleAccountId}`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

const agents = {
  getLatestAgentData,
};

export default agents;
