import { registerRootComponent } from 'expo';
import App from './App';

// NativeWind를 사용 중이시라면 최상단에 global.css를 불러와야 합니다.
import './global.css';

registerRootComponent(App);
