import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import AdminTabsLayout from './components/layout/AdminTabsLayout';
import TabsLayout from './components/layout/TabsLayout';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const AppRoutes: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (currentUser) {
    // Admin users get admin tabs layout
    if (currentUser.role === 'admin') {
      return (
        <IonRouterOutlet>
          <Route path="/admin" component={AdminTabsLayout} />
          <Route exact path="/" render={() => <Redirect to="/admin" />} />
          <Route exact path="/tabs" render={() => <Redirect to="/admin" />} />
          <Route exact path="/auth" render={() => <Redirect to="/admin" />} />
        </IonRouterOutlet>
      );
    }
    // Regular users get tabs layout
    else {
      return (
        <IonRouterOutlet>
          <Route path="/tabs" component={TabsLayout} />
          <Route exact path="/" render={() => <Redirect to="/tabs" />} />
          <Route exact path="/auth" render={() => <Redirect to="/tabs" />} />
        </IonRouterOutlet>
      );
    }
  } else {
    return (
      <IonRouterOutlet>
        <Route exact path="/auth" component={AuthPage} />
        <Route render={() => <Redirect to="/auth" />} />
      </IonRouterOutlet>
    );
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <IonApp>
        <IonReactRouter>
          <AppRoutes />
        </IonReactRouter>
      </IonApp>
    </AuthProvider>
  );
};

export default App;
