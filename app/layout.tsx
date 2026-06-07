import Sidebar from "@/components/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={styles.body}>
        <Sidebar />

        <main style={styles.main}>{children}</main>
      </body>
    </html>
  );
}

const styles: any = {
  body: {
    margin: 0,
    fontFamily: "Arial",
    background: "#f6f7fb",
  },

  main: {
    paddingTop: 70,
    padding: 20,
  },
};