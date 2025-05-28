import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { capitalizeFirstLetter } from '../Constants';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const WebChart = ({ detailedScores }) => {
  const labels = Object.keys(detailedScores || {});
  const dataPoints = Object.values(detailedScores || {});

  const data = {
    labels : labels.map((label)=> capitalizeFirstLetter(label.slice(0,18)+"..")),
    datasets: [
      {
        label: 'Score',
        data: dataPoints,
        backgroundColor: 'rgba(131,114,94, 0.2)',
        borderColor: 'rgba(131,114,94, 1)',
        pointBackgroundColor: 'rgba(131,114,94, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(0, 123, 255, 1)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
  responsive: true,
  layout: {
    width : "90%",
    padding :0,
    textWrap:true
  },
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20,
        backdropColor: 'transparent',
        color: '#666',
      },
      pointLabels: {
        font: {
          size: 11,
          weight: '600',
        },
        color: '#333',
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          return `${context.dataset.label}: ${context.formattedValue}`;
        },
      },
    },
  },
};


  return (
    <div className="flex justify-center items-center w-full">
      <Radar data={data} options={options} />
    </div>
  );
};

export default WebChart;
