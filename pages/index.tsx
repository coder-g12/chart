import Image from "next/image";
import TradeChart from "../components/TradeChart";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center">
      <TradeChart />
    </div>
  );
}
