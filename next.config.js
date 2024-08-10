const { withPlausibleProxy } = require("next-plausible");

/** @type {import('next').NextConfig} */
const nextConfig = {};

const config = withPlausibleProxy()(nextConfig);

module.exports = config;
