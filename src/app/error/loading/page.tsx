const LoadingComponent = () => {
  return (
    <div className="flex items-center h-screen justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary_brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xl font-satoshiBold text-primary_brand-50">
          Chargement en cours...
        </p>
      </div>
    </div>
  );
};

export default LoadingComponent;
