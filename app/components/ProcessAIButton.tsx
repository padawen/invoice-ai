'use client';

interface Props {
  onClick: () => void;
  isProcessing: boolean;
}

const ProcessAIButton = ({ onClick, isProcessing }: Props) => (
  <button
    onClick={onClick}
    disabled={isProcessing}
    className={`mt-4 px-8 py-3 rounded-lg shadow font-semibold ${
      isProcessing
        ? 'bg-green-400 cursor-not-allowed'
        : 'bg-green-600 hover:bg-green-500 text-white'
    }`}
  >
    {isProcessing ? 'Processing...' : 'Process with OpenAI'}
  </button>
);

export default ProcessAIButton;
