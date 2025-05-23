import React from "react";

export default function RightArrow({ className = "", width = '8px', height = '8px' }) {
  return (
    <svg
      style={{width, height}}
      viewBox="0 0 12 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      color="ffffff80"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.8333 5.83325C11.8333 6.17843 11.5534 6.45825 11.2083 6.45825L2.34332 6.45825L5.80811 9.75773C6.05693 9.99698 6.06469 10.3926 5.82544 10.6414C5.58619 10.8903 5.19054 10.898 4.94173 10.6588L0.358394 6.28377C0.235845 6.16594 0.166587 6.00326 0.166587 5.83325C0.166587 5.66324 0.235845 5.50057 0.358394 5.38273L4.94173 1.00773C5.19054 0.768486 5.58619 0.776244 5.82544 1.02506C6.06469 1.27388 6.05693 1.66953 5.80811 1.90877L2.34332 5.20825L11.2083 5.20825C11.5534 5.20825 11.8333 5.48807 11.8333 5.83325Z"
        fill="currentColor"
      ></path>
    </svg>
  );
}
