import { findModuleChild, sleep } from 'decky-frontend-lib';
import { useTranslation } from 'react-i18next';
import { FaReact } from 'react-icons/fa';

import Logger from './logger';
import { getSetting } from './utils/settings';
import TranslationHelper, { TranslationClass } from './utils/TranslationHelper';

const logger = new Logger('DeveloperMode');

let removeSettingsObserver: () => void = () => {};

export async function setShowValveInternal(show: boolean) {
  let settingsMod: any;
  while (!settingsMod) {
    settingsMod = findModuleChild((m) => {
      if (typeof m !== 'object') return undefined;
      for (let prop in m) {
        if (typeof m[prop]?.settings?.bIsValveEmail !== 'undefined') return m[prop];
      }
    });
    if (!settingsMod) {
      logger.debug('[ValveInternal] waiting for settingsMod');
      await sleep(1000);
    }
  }

  if (show) {
    removeSettingsObserver = settingsMod[
      Object.getOwnPropertySymbols(settingsMod).find((x) => x.toString() == 'Symbol(mobx administration)') as any
    ].observe((e: any) => {
      e.newValue.bIsValveEmail = true;
    });
    settingsMod.m_Settings.bIsValveEmail = true;
    logger.log('Enabled Valve Internal menu');
  } else {
    removeSettingsObserver();
    settingsMod.m_Settings.bIsValveEmail = false;
    logger.log('Disabled Valve Internal menu');
  }
}

export async function setShouldConnectToReactDevTools(enable: boolean) {
  window.DeckyPluginLoader.toaster.toast({
    title: enable ? (
      <TranslationHelper trans_class={TranslationClass.DEVELOPER} trans_text={'enabling'} />
    ) : (
      <TranslationHelper trans_class={TranslationClass.DEVELOPER} trans_text={'disabling'} />
    ),
    body: <TranslationHelper trans_class={TranslationClass.DEVELOPER} trans_text={'5secreload'} />,
    icon: <FaReact />,
  });
  await sleep(5000);
  return enable
    ? window.DeckyPluginLoader.callServerMethod('enable_rdt')
    : window.DeckyPluginLoader.callServerMethod('disable_rdt');
}

export async function startup() {
  const isValveInternalEnabled = await getSetting('developer.valve_internal', false);
  const isRDTEnabled = await getSetting('developer.rdt.enabled', false);

  if (isValveInternalEnabled) setShowValveInternal(isValveInternalEnabled);

  if ((isRDTEnabled && !window.deckyHasConnectedRDT) || (!isRDTEnabled && window.deckyHasConnectedRDT))
    setShouldConnectToReactDevTools(isRDTEnabled);
}
