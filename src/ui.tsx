import {
  Button,
  Container,
  render,
  VerticalSpace,
  Text,
  TextboxMultiline,
} from '@create-figma-plugin/ui';
import { emit, on } from '@create-figma-plugin/utilities';
import { h } from 'preact';
import { useCallback, useState } from 'preact/hooks';

// Define handler types for events from the main thread
export type ProgressUpdateHandler = (message: string) => void;
export type ConversionCompleteHandler = () => void;
export type ConversionErrorHandler = () => void;

function Plugin() {
  const [progressMessage, setProgressMessage] = useState<string>('Ready.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [totalNodes, setTotalNodes] = useState<string>('N/A');
  const [convertedNodes, setConvertedNodes] = useState<string>('N/A');

  const handleConvertButtonClick = useCallback(function () {
    setProgressMessage('Starting conversion...');
    setIsProcessing(true);
    setTotalNodes('N/A');
    setConvertedNodes('N/A');
    emit('CONVERT_COLORS');
  }, []);

  // Set up listeners directly in the component body
  on('PROGRESS_UPDATE', (message: string) => {
    setProgressMessage(message);
  });

  on('NODES_FOUND', ({ total }) => {
    setTotalNodes(String(total));
  });

  on('NODES_CONVERTED', ({ converted }) => {
    setConvertedNodes(String(converted));
  });

  const handleFinish = () => {
    setIsProcessing(false);
    // Optionally reset progress message or rely on figma.notify
    // setProgressMessage("Finished.");
  };

  on('CONVERSION_COMPLETE', handleFinish);
  on('CONVERSION_ERROR', handleFinish);

  return (
    <Container space="medium">
      <VerticalSpace space="medium" />
      <Text>Total Nodes Found: {totalNodes}</Text>
      <Text>Nodes Converted: {convertedNodes}</Text>
      <VerticalSpace space="medium" />
      <Text>Status:</Text>
      <VerticalSpace space="small" />
      <TextboxMultiline
        rows={3}
        value={progressMessage}
      />
      <VerticalSpace space="large" />
      <Button fullWidth onClick={handleConvertButtonClick} disabled={isProcessing}>
        {isProcessing ? 'Converting...' : 'Convert Selected Frames'}
      </Button>
      <VerticalSpace space="small" />
    </Container>
  );
}

export default render(Plugin);
