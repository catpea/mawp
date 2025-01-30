import Signals from 'signals';

export default class Settings extends Signals {

 getConfigurationObject(){
    const response = Object.fromEntries(Object.entries(this.data.value).map(([k,v])=>[k,v.data.value]));
    return response;
  }

  getSettingsList() {
    const response =  Object.entries(this.data.value).map(([k,v])=>[k,v]) ;
    return response;
  }

}
