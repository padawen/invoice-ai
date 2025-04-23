'use client';

interface Props {
  onClick: () => void;
  isDetecting: boolean;
}

const DetectTypeButton = ({ onClick, isDetecting }: Props) => (
  <button
    onClick={onClick}
    disabled={isDetecting}
    className={`px-6 py-3 rounded-lg shadow font-semibold ${
      isDetecting
        ? 'bg-blue-400 cursor-not-allowed'
        : 'bg-blue-600 hover:bg-blue-500 text-white'
    }`}
  >
    {isDetecting ? 'Detecting...' : 'Detect PDF Type'}
  </button>
);

export default DetectTypeButton;
