import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface PriceHistoryData {
  price: number | null;
  recordedAt: Date;
}

interface PriceHistoryChartProps {
  data: PriceHistoryData[];
  productName: string;
}

export function PriceHistoryChart({ data, productName }: PriceHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        가격 히스토리 데이터가 없습니다.
      </div>
    );
  }

  // 데이터 포맷팅 (null 가격 필터링)
  const chartData = data
    .filter((item) => item.price !== null)
    .map((item) => ({
      date: format(new Date(item.recordedAt), "MM/dd", { locale: ko }),
      fullDate: format(new Date(item.recordedAt), "yyyy-MM-dd HH:mm", { locale: ko }),
      price: item.price!,
    }));

  // 가격 범위 계산
  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const yAxisMin = Math.max(0, minPrice - priceRange * 0.1);
  const yAxisMax = maxPrice + priceRange * 0.1;

  // 가격 상승/하락 색상 결정
  const firstPrice = chartData[0]?.price || 0;
  const lastPrice = chartData[chartData.length - 1]?.price || 0;
  const lineColor = lastPrice >= firstPrice ? "#ff4444" : "#4444ff";

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-foreground">{productName} - 가격 변동 추이</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            stroke="#888"
            tick={{ fill: "#888" }}
            tickLine={{ stroke: "#888" }}
          />
          <YAxis
            domain={[yAxisMin, yAxisMax]}
            stroke="#888"
            tick={{ fill: "#888" }}
            tickLine={{ stroke: "#888" }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "8px",
              color: "#fff",
            }}
            labelStyle={{ color: "#888" }}
            formatter={(value: number) => [`${value.toLocaleString()}원`, "가격"]}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0]?.payload?.fullDate || label;
              }
              return label;
            }}
          />
          <Legend
            wrapperStyle={{ color: "#888" }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
            name="가격"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex justify-between text-sm text-muted-foreground">
        <div>
          <span className="font-semibold">최저가:</span> {minPrice.toLocaleString()}원
        </div>
        <div>
          <span className="font-semibold">최고가:</span> {maxPrice.toLocaleString()}원
        </div>
        <div>
          <span className="font-semibold">변동폭:</span> {priceRange.toLocaleString()}원
        </div>
      </div>
    </div>
  );
}
