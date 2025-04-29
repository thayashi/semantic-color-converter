import {
  Button,
  Container,
  render,
  VerticalSpace,
  Text,
  TextboxMultiline,
  Columns,
  Stack,
  Divider,
} from '@create-figma-plugin/ui';
import { emit, on } from '@create-figma-plugin/utilities';
import { h } from 'preact';
import { useCallback, useState } from 'preact/hooks';

// Fallback for loading icon: use a spinning emoji or a simple text
function LoadingIcon() {
  return (
    <span
      style={{
        display: "inline-block",
        animation: "spin 1s linear infinite",
        fontSize: 16,
        marginRight: 2,
      }}
    >
      ⏳
    </span>
  );
}

type StatusType = "ready" | "processing" | "complete" | "error";

function getStatusInfo(status: StatusType) {
  switch (status) {
    case "processing":
      return { icon: <LoadingIcon />, color: "#007AFF", label: "Processing..." };
    case "complete":
      return { icon: <span style={{ fontSize: 16 }}>✅</span>, color: "#18A058", label: "Complete" };
    case "error":
      return { icon: <span style={{ fontSize: 16 }}>⚠️</span>, color: "#FF3B30", label: "Error" };
    default:
      return { icon: <span style={{ fontSize: 16 }}>ℹ️</span>, color: "#888", label: "Ready" };
  }
}

function Plugin() {
  const [progressMessage, setProgressMessage] = useState<string>('Ready.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [totalNodes, setTotalNodes] = useState<string>('N/A');
  const [convertedNodes, setConvertedNodes] = useState<string>('N/A');
  const [status, setStatus] = useState<StatusType>("ready");

  const handleConvertButtonClick = useCallback(function () {
    setProgressMessage('Starting conversion...');
    setIsProcessing(true);
    setTotalNodes('N/A');
    setConvertedNodes('N/A');
    setStatus("processing");
    emit('CONVERT_COLORS');
  }, []);

  on('PROGRESS_UPDATE', (message: string) => {
    setProgressMessage(message);
    setStatus("processing");
  });

  on('NODES_FOUND', ({ total }) => {
    setTotalNodes(String(total));
  });

  on('NODES_CONVERTED', ({ converted }) => {
    setConvertedNodes(String(converted));
  });

  const handleFinish = (type: StatusType) => {
    setIsProcessing(false);
    setStatus(type);
  };

  on('CONVERSION_COMPLETE', () => handleFinish("complete"));
  on('CONVERSION_ERROR', () => handleFinish("error"));

  const statusInfo = getStatusInfo(status);

  return (
    <Container space="small">
      <VerticalSpace space="small" />
      <Stack space="extraSmall">
        <Text style={{ fontWeight: 600, fontSize: 15 }}>
          Semantic Color Converter
        </Text>
        <Text style={{ color: "#888", fontSize: 12 }}>
          Convert selected Figma nodes to use semantic color variables.
        </Text>
      </Stack>
      <Divider />
      <VerticalSpace space="small" />
      <Stack space="extraSmall">
        <Text style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>Node Summary</Text>
        <Columns space="extraSmall">
          <Stack space="extraSmall">
            <Text style={{ color: "#888", fontSize: 11 }}>Total Nodes</Text>
            <Text
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: "#007AFF",
                lineHeight: 1.2,
              }}
            >
              {totalNodes}
            </Text>
          </Stack>
          <Stack space="extraSmall">
            <Text style={{ color: "#888", fontSize: 11 }}>Converted</Text>
            <Text
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: "#18A058",
                lineHeight: 1.2,
              }}
            >
              {convertedNodes}
            </Text>
          </Stack>
        </Columns>
      </Stack>
      <VerticalSpace space="small" />
      <Divider />
      <VerticalSpace space="small" />
      <Stack space="extraSmall">
        <Text style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>Status</Text>
        <Columns space="extraSmall">
          <span style={{ display: "flex", alignItems: "center" }}>
            {statusInfo.icon}
            <Text
              style={{
                color: statusInfo.color,
                fontWeight: 600,
                marginLeft: 6,
                fontSize: 14,
              }}
            >
              {statusInfo.label}
            </Text>
          </span>
        </Columns>
        <TextboxMultiline
          rows={2}
          value={progressMessage}
          style={{
            background: "#222",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: 6,
            fontSize: 13,
            marginTop: 2,
            resize: "none",
            minHeight: 32,
            maxHeight: 38,
            overflow: "hidden",
          }}
        />
      </Stack>
      <VerticalSpace space="medium" />
      <Button fullWidth onClick={handleConvertButtonClick} disabled={isProcessing}>
        {isProcessing ? 'Converting...' : 'Convert Selected Frames'}
      </Button>
      <VerticalSpace space="small" />
    </Container>
  );
}

export default render(Plugin);
