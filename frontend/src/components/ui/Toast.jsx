// import { useEffect } from 'react';

// export default function Toast({ message, type = 'info', onClose }) {
//   useEffect(() => {
//     const timer = setTimeout(onClose, 4000);
//     return () => clearTimeout(timer);
//   }, [onClose]);

//   return (
//     <div className={`toast ${type}`} onClick={onClose}>
//       {message}
//     </div>
//   );
// }