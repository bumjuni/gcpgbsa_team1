import { AppRegistry } from 'react-native';
import App from './App';
import name from './app.json';

AppRegistry.registerComponent(name.name || 'gcp_gbsa_1', () => App);
AppRegistry.runApplication(name.name || 'gcp_gbsa_1', {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
