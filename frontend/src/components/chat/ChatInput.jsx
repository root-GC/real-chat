// import { useState } from 'react';

// export default function ChatInput({ onSend }) {
//   const [text, setText] = useState('');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (text.trim()) {
//       onSend(text);
//       setText('');
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="chat-input">
//       <input
//         type="text"
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         placeholder="Escreva uma mensagem..."
//       />
//       <button type="submit">Enviar</button>
//     </form>
//   );
// }