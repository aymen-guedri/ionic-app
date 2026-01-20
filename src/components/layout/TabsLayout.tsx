import React from 'react';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react';
import { Route, Redirect } from 'react-router-dom';
import { home, car, person } from 'ionicons/icons';
import Home from '../../pages/Home';
import ReservationsPage from '../../pages/ReservationsPage';
import ProfilePage from '../../pages/ProfilePage';

const TabsLayout: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/home" component={Home} />
        <Route exact path="/tabs/parking" component={ReservationsPage} />
        <Route exact path="/tabs/profile" component={ProfilePage} />
        <Route exact path="/tabs" render={() => <Redirect to="/tabs/home" />} />
      </IonRouterOutlet>
      
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home">
          <IonIcon icon={home} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="parking" href="/tabs/parking">
          <IonIcon icon={car} />
          <IonLabel>Mes Réservations</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={person} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default TabsLayout;