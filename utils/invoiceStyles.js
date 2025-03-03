const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getInvoiceStyles = () => ({
  container: {
    border: '1px solid #ddd',
    padding: 20,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    bold: true,
    alignment: 'center',
    margin: { bottom: 15 },
  },
  logo: {
    alignment: 'center',
    margin: { bottom: 20 },
    width: 100,
    height: 100,
    image: '', // Inserted logo link
  },
  companyDetails: {
    fontSize: 14,
    alignment: 'center',
    margin: { bottom: 20 },
    color: '#555',
  },
  subheader: {
    fontSize: 16,
    bold: true,
    margin: { top: 15, bottom: 10 },
    color: '#333',
  },
  body: {
    fontSize: 12,
    lineHeight: 1.6,
    margin: { bottom: 10 },
  },
  table: {
    fontSize: 12,
    margin: { top: 10, bottom: 10 },
    layout: 'lightHorizontalLines',
  },
  total: {
    fontSize: 14,
    bold: true,
    alignment: 'right',
    margin: { top: 10 },
    color: '#000',
  },
  footer: {
    fontSize: 10,
    color: 'grey',
    alignment: 'center',
    margin: { top: 20 },
  },
});

module.exports = {
  formatCurrency,
  getInvoiceStyles,
};
