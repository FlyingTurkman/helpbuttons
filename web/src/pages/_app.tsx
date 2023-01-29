import type { AppProps } from 'next/app';
import '../styles/app.scss';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import NavBottom from 'components/nav/NavBottom'; //just for mobile
import Alert from 'components/overlay/Alert';
import { httpService } from 'services/HttpService';
import { UserService } from 'services/Users';
import { appWithTranslation } from 'next-i18next';
import { GlobalState, store } from 'pages';
import { FetchDefaultNetwork } from 'state/Networks';
import { FetchUserData, SetCurrentUser } from 'state/Users';

import { useRef } from 'store/Store';
import { GetConfig } from 'state/Setup';
import { alertService } from 'services/Alert';
import { SetupSteps } from '../shared/setupSteps';
import { SetupDtoOut } from 'shared/entities/setup.entity';

export default appWithTranslation(MyApp);

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  const config = useRef(store, (state: GlobalState) => state.config);
  const path = router.asPath.split('?')[0];

  const currentUser = useRef(
    store,
    (state: GlobalState) => state.users.currentUser,
  );

  const setupPaths: string[] = [
    SetupSteps.CREATE_ADMIN_FORM,
    SetupSteps.FIRST_OPEN,
    SetupSteps.NETWORK_CREATION,
    SetupSteps.SYSADMIN_CONFIG,
  ];

  // // Whenever we log in or log out, fetch user data


  useEffect(() => {

    if (!config && SetupSteps.SYSADMIN_CONFIG.toString() == path) {
      setIsSetup(true);
    }else if (!config) {
      getConfig(getConfigSuccess, getConfigError);
    }else{
      if (SetupSteps.CREATE_ADMIN_FORM.toString() == path) {
        setIsSetup(true)
      }else {
        authCheck();
      }
    }

    function getConfigError(err) {
      console.error('getting config error:')
      if (err == 'nosysadminconfig') {
        alertService.error(
          `Something went wrong, you can go to the <a href="${SetupSteps.SYSADMIN_CONFIG}"> configuration wizard</a>`,
        );
        return;
      }

      if (err == 'need-migrations') {
        alertService.warn(err);
        return;
      }

      console.log(err);
      alertService.error(
        `Something went wrong, you can go to the <a href="${SetupSteps.SYSADMIN_CONFIG}" configuration wizard`,
      );
    }

    function getConfigSuccess(config: SetupDtoOut) {
      if (config.databaseNumberMigrations < 1) {
        alertService.error(`Missing database schema, please run schema creation/migrations! and then <a href="/">click here</a>`);
        return;
      } else if (
        config.userCount < 1 &&
        SetupSteps.CREATE_ADMIN_FORM != path
      ) {
        alertService.warn(
          `Missing admin account, please <u><a href="${SetupSteps.CREATE_ADMIN_FORM}">create yours</a></u>!`,
        );
        return;
      }

      if (!setupPaths.includes(path)) {
        getDefaultNetwork(
          () => {
            // setIsSetup(true);
            console.log('all is ready!');
          },
          (error) => {
            if (error === 'network-not-found') {
              alertService.warn(
                `You didn't configured your network yet. Go to the network <a href="${SetupSteps.NETWORK_CREATION}">configuration page</a>`,
              );
            } else {
              alertService.error(JSON.stringify(error));
            }
          },
        );
      }
    }

  }, [path, isSetup, authorized, config]);

  function getConfig(onSuccess, onError) {
    store.emit(new GetConfig(onSuccess, onError));
  }

  function getDefaultNetwork(onSucess, onError) {
    store.emit(new FetchDefaultNetwork(onSucess, onError));
  }

  function authCheck() {
    // redirect to login page if accessing a private page and not logged in
    const publicPaths = [
      '/Login',
      '/Signup',
      '/RepositoryPage',
      '/Faqs',
      '/',
      '/ButtonNew',
      '/Explore',
      '/HomeInfo',
      '/ButtonFile/[id]',
    ];

    const path = router.asPath.split('?')[0];

    if (
      !UserService.isLoggedIn() &&
      !publicPaths.includes(path)
    ) {
      // and is not 404
      if (path != '/Login') {
        router
          .push({
            pathname: '/Login',
            query: { returnUrl: router.asPath },
          })
          .catch((err) => {
            // console.log(err)
          });
      }
    } else {
      setAuthorized(true);
    }
  }

  return (
    <>
      <Head>
        <title>Helpbuttons.org</title>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
      </Head>
      <div className={`${user ? '' : ''}`}>
        <Alert />
        {(() => {
          if (config && authorized) {
            return (
              <div>
                <Component {...pageProps} />

                <NavBottom logged={!!currentUser} />
              </div>
            );
          } else if (isSetup) {
            return (
              <div>
                <Component {...pageProps} />
              </div>
            );
          }

          return <div>Loading...</div>;
        })()}
      </div>
    </>
  );
}
