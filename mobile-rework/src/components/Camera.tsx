import { CameraView } from 'expo-camera';
import { cssInterop } from 'nativewind';

cssInterop(CameraView, { className: 'style' });

export { CameraView };
