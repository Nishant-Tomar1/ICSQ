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
    labels: labels.map((label) => capitalizeFirstLetter(label.slice(0, 18) + "..")),
    datasets: [
      {
        label: 'Score',
        data: dataPoints,
        backgroundColor: 'rgba(131,114,94, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.8)',
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: '#000',
        pointHoverBackgroundColor: '#000',
        pointHoverBorderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    layout: {
      padding: 0,
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
          color: '#ccc', // Light text for dark background
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Light grid lines
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
        pointLabels: {
          font: {
            size: 11,
            weight: '600',
          },
          color: '#fff', // Labels color
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#333',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#555',
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.formattedValue}`;
          },
        },
      },
    },
  };

  return (
    <div className="flex justify-center items-center w-full bg-transparent">
      <Radar data={data} options={options} />
    </div>
  );
};

export default WebChart;
