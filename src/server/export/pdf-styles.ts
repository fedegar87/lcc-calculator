import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    backgroundColor: "#C8102E",
    padding: 16,
    marginBottom: 20,
  },
  headerText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  subText: {
    color: "white",
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    color: "#333",
  },
  table: {
    flexDirection: "column",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderColor: "#333",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
    minHeight: 18,
  },
  tableCell: {
    flex: 1,
    padding: 4,
    fontSize: 9,
  },
  tableCellRight: {
    flex: 1,
    padding: 4,
    fontSize: 9,
    textAlign: "right",
  },
  tableCellBold: {
    flex: 1,
    padding: 4,
    fontSize: 9,
    fontWeight: "bold",
  },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 6,
    marginBottom: 4,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  kpiLabel: {
    fontSize: 10,
    color: "#666",
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  chartImage: {
    marginVertical: 12,
    width: 460,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
