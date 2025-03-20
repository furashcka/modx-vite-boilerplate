let config = null;

const setViteConfig = (_config) => (config = _config);
const getViteConfig = () => config;

export { setViteConfig, getViteConfig };
