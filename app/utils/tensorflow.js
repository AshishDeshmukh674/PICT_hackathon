import * as tf from '@tensorflow/tfjs';

// Initialize TensorFlow.js for browser
export const initTensorFlow = async () => {
  await tf.ready();
  return tf;
};

export default tf; 