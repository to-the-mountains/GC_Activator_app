const { fetchAuthToken } = require('./service');

(async () => {
  try {
    const tokenData = await fetchAuthToken();
    console.log('Token Data:', tokenData);
  } catch (error) {
    console.error('Error during token fetch:', error.message);
  }
})();
