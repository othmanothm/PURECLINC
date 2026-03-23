import Cookies from 'js-cookie';

const COOKIE_OPTIONS = {
  expires: 365, // 1 year
  sameSite: 'strict',
  secure: window.location.protocol === 'https:',
};

export const cookieUtils = {
  get: (key) => {
    return Cookies.get(key);
  },

  set: (key, value) => {
    Cookies.set(key, value, COOKIE_OPTIONS);
  },

  remove: (key) => {
    Cookies.remove(key);
  },
};

