import { createRoot } from 'react-dom/client';
import './lib/polyfills.ts';
import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
