import {cn} from '../../lib/utils';
import {motion} from 'framer-motion';

const StatCard = ({ 
  title, 
  value, 
  change, 
  isPositive, 
  icon,
  description,
  className
}) => {
  return (
    <motion.div 
      className={cn("card bg-white dark:bg-gray-800 overflow-hidden", className)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h3>
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
            isPositive 
              ? 'bg-success-500/10 text-success-500' 
              : 'bg-error-500/10 text-error-500'
          }`}>
            <span>{icon}</span>
            <span className="ml-1">{change}</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard; 
