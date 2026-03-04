/**
 * @format
 */

// Must be set before any Reanimated import — enables shared element transitions
global.__enableSharedElementTransitions = true;

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
