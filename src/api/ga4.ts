import { apiPost, apiGet } from "./index";

const baseurl = "/ga4";

async function getKeyDataByPropertyId(propertyId: string) {
  try {
    return await apiPost({
      path: baseurl + `/getKeyDataByPropertyId`,
      passedData: { propertyId },
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function getProperties() {
  try {
    return await apiGet({
      path: baseurl + `/properties/get`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function getPropertiesDetails() {
  try {
    return await apiGet({
      path: baseurl + `/diag/properties`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

const ga4 = {
  getKeyDataByPropertyId,
  getProperties,
  getPropertiesDetails,
};

export default ga4;
