function summarizeDataset(dataset) {
  const channelCount = Array.isArray(dataset.channels)
    ? dataset.channels.length
    : 0;

  const firstChannel = channelCount > 0 ? dataset.channels[0] : null;
  const length =
    firstChannel && Array.isArray(firstChannel.data)
      ? firstChannel.data.length
      : 0;

  return {
    id: dataset.id,
    name: dataset.name,
    type: dataset.type,
    samplingRate: dataset.samplingRate,
    channelCount,
    length,
    meta: dataset.meta || {},
  };
}

module.exports = {
  summarizeDataset,
};
