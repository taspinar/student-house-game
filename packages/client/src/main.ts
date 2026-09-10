import { greeting } from '@student-house-game/shared';
import './style.css';

const message = document.querySelector<HTMLParagraphElement>('#greeting');
if (message) message.textContent = greeting;
