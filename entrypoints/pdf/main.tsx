import { createRoot } from 'react-dom/client';
import '../../assets/tailwind.css';
import 'pdfjs-dist/web/pdf_viewer.css';
import './style.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
