const subtractWithFixed = (totalAmount, referenceAmount) => {
  return parseFloat(Math.max(totalAmount - referenceAmount, 0)).toFixed(2);
};

const sumWithFixed = (totalAmount, referenceAmount) => {
  return parseFloat(totalAmount + referenceAmount).toFixed(2);
};

module.exports = { subtractWithFixed, sumWithFixed };
