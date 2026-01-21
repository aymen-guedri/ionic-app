import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/react';
import { analytics, time, location, car, people, person } from 'ionicons/icons';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminReservations from '../../pages/admin/AdminReservations';
import AdminZones from '../../pages/admin/AdminZones';
import AdminSpots from '../../pages/admin/AdminSpots';
import AdminUsers from '../../pages/admin/AdminUsers';
import ProfilePage from '../../pages/ProfilePage';

const AdminTabsLayout = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/admin/dashboard" component={AdminDashboard} />
        <Route exact path="/admin/reservations" component={AdminReservations} />
        <Route exact path="/admin/zones" component={AdminZones} />
        <Route exact path="/admin/spots" component={AdminSpots} />
        <Route exact path="/admin/users" component={AdminUsers} />
        <Route exact path="/admin/profile" component={ProfilePage} />
        <Route exact path="/admin" render={() => <Redirect to="/admin/dashboard" />} />
      </IonRouterOutlet>
      
      <IonTabBar slot="bottom">
        <IonTabButton tab="dashboard" href="/admin/dashboard">
          <IonIcon icon={analytics} />
          <IonLabel>Dashboard</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="reservations" href="/admin/reservations">
          <IonIcon icon={time} />
          <IonLabel>Reservations</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="zones" href="/admin/zones">
          <IonIcon icon={location} />
          <IonLabel>Zones</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="spots" href="/admin/spots">
          <IonIcon icon={car} />
          <IonLabel>Spots</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="users" href="/admin/users">
          <IonIcon icon={people} />
          <IonLabel>Users</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="profile" href="/admin/profile">
          <IonIcon icon={person} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default AdminTabsLayout;