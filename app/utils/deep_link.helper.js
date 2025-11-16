const BASE_DEEP_LINK = "asar://matna.app";

export const buildDeepLink = (source, id) => {
    const url = new URL(BASE_DEEP_LINK);
    url.searchParams.set("source", source);
    url.searchParams.set("id", id);
    return url.toString();
};

export const buildExternalLink = (externalUrl) => {
    const url = new URL(BASE_DEEP_LINK);
    url.searchParams.set("source", "external");
    url.searchParams.set("id", externalUrl);
    return url.toString();
};