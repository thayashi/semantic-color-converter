import {
  Button,
  Container,
  render,
  VerticalSpace,
  Text, // Import Text component for displaying messages
  TextboxMultiline, // Import TextboxMultiline instead
} from '@create-figma-plugin/ui';
import { emit, on } from '@create-figma-plugin/utilities'; // Import 'on'
import { h } from 'preact';
// Remove useEffect import
import { useCallback, useState } from 'preact/hooks';

// Define handler types for events from the main thread
export type ProgressUpdateHandler = (message: string) => void;
export type ConversionCompleteHandler = () => void;
export type ConversionErrorHandler = () => void;


function Plugin() {
  const [progressMessage, setProgressMessage] = useState<string>('Ready.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleConvertButtonClick = useCallback(function () {
    setProgressMessage('Starting conversion...');
    setIsProcessing(true);
    // Emit the event name; the handler type is defined in main.ts
    emit('CONVERT_COLORS');
  }, []);

  // Set up listeners directly in the component body
  on('PROGRESS_UPDATE', (message: string) => {
    setProgressMessage(message);
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
      <Text>Status:</Text>
      <VerticalSpace space="small" />
      {/* Replace pre with TextboxMultiline for theme compatibility */}
      <TextboxMultiline
        rows={3} // Adjust rows as needed for initial height
        value={progressMessage}
        // readOnly prop removed
        // onValueChange prop removed
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
