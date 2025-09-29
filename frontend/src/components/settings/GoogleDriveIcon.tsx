import React from "react";

interface GoogleDriveIconProps {
  className?: string;
}

const GoogleDriveIcon: React.FC<GoogleDriveIconProps> = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.94 4.5L12 11.09L16.06 4.5H7.94Z"
        fill="#0F9D58"
      />
      <path
        d="M7.94 4.5L2.25 14.5L7.19 14.5L12.75 5.5L7.94 4.5Z"
        fill="#F4B400"
      />
      <path
        d="M16.06 4.5L12.75 5.5L18.31 14.5L21.75 14.5L16.06 4.5Z"
        fill="#EA4335"
      />
      <path
        d="M7.19 14.5L2.25 14.5L4.5 19.5L19.5 19.5L21.75 14.5L18.31 14.5L12 23L7.19 14.5Z"
        fill="#0F9D58"
      />
    </svg>
  );
};

export default GoogleDriveIcon;