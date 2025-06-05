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
  Tabs,
  Checkbox,
  Modal,
} from '@create-figma-plugin/ui';
import { emit, on } from '@create-figma-plugin/utilities';
import { h } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { defaultAdvancedMappings, AdvancedMappingEntry } from './mappings/advancedMappings';

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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [totalNodes, setTotalNodes] = useState<string>('N/A');
  const [convertedNodes, setConvertedNodes] = useState<string>('N/A');
  const [status, setStatus] = useState<StatusType>("ready");

  // Modal for node limit
  const [showNodeLimitModal, setShowNodeLimitModal] = useState<boolean>(false);
  const [nodeLimit, setNodeLimit] = useState<number>(3000);

  // Tab state: "main" or "advanced"
  const [tabId, setTabId] = useState<string>("main");
  // Checkbox state for Advanced Options
  const [advancedMappings, setAdvancedMappings] = useState<AdvancedMappingEntry[]>(
    defaultAdvancedMappings.map((entry: AdvancedMappingEntry) => ({ ...entry }))
  );

  const handleAdvancedMappingChange = (id: string) => {
    setAdvancedMappings((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, enabled: !entry.enabled } : entry
      )
    );
  };

  const handleConvertButtonClick = useCallback(function () {
    setIsProcessing(true);
    setTotalNodes('N/A');
    setConvertedNodes('N/A');
    setStatus("processing");
    // Send only enabled Advanced Mappings
    const enabledAdvancedMappings = advancedMappings.filter((entry) => entry.enabled);
    emit('CONVERT_COLORS', { advancedMappings: enabledAdvancedMappings });
  }, [advancedMappings]);


  on('NODES_FOUND', ({ total }) => {
    setTotalNodes(String(total));
  });

  on('NODES_CONVERTED', ({ converted }) => {
    setConvertedNodes(String(converted));
  });

  // Listen for node limit modal event
  on('SHOW_NODE_LIMIT_MODAL', ({ nodeLimit }) => {
    setNodeLimit(nodeLimit);
    setShowNodeLimitModal(true);
    setIsProcessing(false);
    setStatus("ready");
    setTotalNodes('N/A');
    setConvertedNodes('N/A');
  });

  const handleCloseNodeLimitModal = () => {
    setShowNodeLimitModal(false);
  };

  const handleFinish = (type: StatusType) => {
    setIsProcessing(false);
    setStatus(type);
  };

  on('CONVERSION_COMPLETE', () => handleFinish("complete"));
  on('CONVERSION_ERROR', () => handleFinish("error"));

  const statusInfo = getStatusInfo(status);

  return (
    <Container space="small">
      {showNodeLimitModal && (
        <Modal title="Too Many Nodes Selected" onClose={handleCloseNodeLimitModal} open={true}>
          <Text>
            {`The number of selected nodes exceeds the limit (${nodeLimit}). Please reduce your selection and try again.`}
          </Text>
          <VerticalSpace space="small" />
          <Button onClick={handleCloseNodeLimitModal}>OK</Button>
        </Modal>
      )}
      <div>
        <VerticalSpace space="small" />
        <Tabs
          options={[
            { value: "main", children: "" },
            { value: "advanced", children: "" }
          ]}
          value={tabId}
          onChange={event => setTabId(event.currentTarget.value)}
        />
        <VerticalSpace space="small" />
        {tabId === "main" ? (
          <div>
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
            </Stack>
            <VerticalSpace space="medium" />
            <Button fullWidth onClick={handleConvertButtonClick} disabled={isProcessing}>
              {isProcessing ? 'Converting...' : 'Convert Selected Frames'}
            </Button>
            <VerticalSpace space="small" />
          </div>
        ) : (
          <div>
            <Stack space="extraSmall">
              <Text style={{ fontWeight: 500, fontSize: 12, marginTop: 8 }}>For Fill</Text>
              {advancedMappings.filter(e => e.target === "fill").map((entry) => (
                <Checkbox
                  key={entry.id}
                  value={entry.enabled}
                  onChange={() => handleAdvancedMappingChange(entry.id)}
                >
                  {entry.label}
                  {entry.description ? (
                    <span style={{ color: "#888", fontSize: 10, marginLeft: 4 }}>
                      ({entry.description})
                    </span>
                  ) : null}
                </Checkbox>
              ))}
              <Text style={{ fontWeight: 500, fontSize: 12, marginTop: 8 }}>For Stroke</Text>
              {advancedMappings.filter(e => e.target === "stroke").map((entry) => (
                <Checkbox
                  key={entry.id}
                  value={entry.enabled}
                  onChange={() => handleAdvancedMappingChange(entry.id)}
                >
                  {entry.label}
                  {entry.description ? (
                    <span style={{ color: "#888", fontSize: 10, marginLeft: 4 }}>
                      ({entry.description})
                    </span>
                  ) : null}
                </Checkbox>
              ))}
            </Stack>
            <VerticalSpace space="medium" />
            <Button fullWidth onClick={handleConvertButtonClick} disabled={isProcessing}>
              {isProcessing ? 'Converting...' : 'Convert Selected Frames'}
            </Button>
            <VerticalSpace space="small" />
          </div>
        )}
      </div>
    </Container>
  );
}

export default render(Plugin);
