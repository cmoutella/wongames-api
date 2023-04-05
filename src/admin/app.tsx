import Joystick from './extensions/Joystick.png'
import Logo from './extensions/Logo.svg'


export default {
  config: {
    locales: [
      // 'ar',
      // 'fr',
      // 'cs',
      // 'de',
      // 'dk',
      // 'es',
      // 'he',
      // 'id',
      // 'it',
      // 'ja',
      // 'ko',
      // 'ms',
      // 'nl',
      // 'no',
      // 'pl',
      // 'pt-BR',
      // 'pt',
      // 'ru',
      // 'sk',
      // 'sv',
      // 'th',
      // 'tr',
      // 'uk',
      // 'vi',
      // 'zh-Hans',
      // 'zh',
    ],
    menu: {
      logo: Joystick
    },
    auth: {
      logo: Logo
    },
    head: {
      favicon: Joystick,
    },
    tutorials: false,
    notifications: {
      releases: false
    }
  },
  bootstrap(app) {
    console.log(app);
  },
};
