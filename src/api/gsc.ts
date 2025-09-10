import { apiPost, apiGet } from "./index";

const baseurl = "/gsc";

async function getKeyDataByDomainProperty(domainProperty: string) {
  try {
    return await apiPost({
      path: baseurl + `/getKeyData`,
      passedData: { domainProperty },
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function getSites() {
  try {
    return await apiGet({
      path: baseurl + `/sites/get`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function getAIReadyData(domainProperty: string) {
  try {
    return await apiPost({
      path: baseurl + `/getAIReadyData`,
      passedData: { domainProperty },
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function getDiagSites() {
  try {
    return await apiGet({
      path: baseurl + `/diag/sites`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

const gsc = {
  getKeyDataByDomainProperty,
  getSites,
  getAIReadyData,
  getDiagSites,
};

export default gsc;
