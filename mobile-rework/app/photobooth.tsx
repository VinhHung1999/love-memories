// PB5: photobooth lives at root stack level (not inside (modal)) so it can
// use presentation:'fullScreenModal' — inside the (modal) group that option
// is overridden by the parent group's own modal presentation, leaving rounded
// corners. Root-level Stack.Screen + fullScreenModal = true full screen.
export { PhotoboothScreen as default } from '@/screens/Photobooth';
