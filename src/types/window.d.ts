declare global {
  interface Window {
    FB: {
      init: (config: {
        appId: string;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options?: { scope: string }
      ) => void;
    };
    fbAsyncInit?: () => void;
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          callback: (response: GoogleSignInResponse) => void;
        };
      };
    };
  }
}

interface GoogleSignInResponse {
  credential?: string;
  clientId: string;
  select_by: string;
}

interface FacebookLoginResponse {
  authResponse?: {
    accessToken: string;
    userID: string;
    expiresIn: number;
    signedRequest: string;
  };
  status: string;
}

export {};
