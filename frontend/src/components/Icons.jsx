export function LeafIcon({ className = 'w-10 h-10' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 32C10 32 8 20 16 12C24 4 36 4 36 4C36 4 38 16 30 24C22 32 10 32 10 32Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 32C16 26 24 18 36 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MagnifierLeafIcon({ className = 'w-10 h-10' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="17" cy="17" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M24.5 24.5L34 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M13 19C13 19 14 15 18 13C22 11 24 13 24 13C24 13 23 17 19 19C15 21 13 19 13 19Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatBubbleIcon({ className = 'w-10 h-10' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 10C6 8.89543 6.89543 8 8 8H32C33.1046 8 34 8.89543 34 10V24C34 25.1046 33.1046 26 32 26H14L8 32V26H8C6.89543 26 6 25.1046 6 24V10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 15H26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 20H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
